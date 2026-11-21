import csv
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = (
    "process_airports.sh",
    "extract_codes.py",
    "check_unknown_codes.py",
    "enrich_airports.py",
    "build_data.py",
    "generate_homepage_data.py",
)


def run(*args, cwd, env=None, check=True):
    return subprocess.run(
        args, cwd=cwd, env=env, check=check, text=True,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )


class AirportProcessingTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.seed = self.root / "seed"
        self.remote = self.root / "remote.git"
        self.checkout = self.root / "checkout"
        data = self.seed / "air" / "data"
        scripts = self.seed / "air" / "scripts"
        data.mkdir(parents=True)
        scripts.mkdir()
        for script in SCRIPTS:
            shutil.copy(ROOT / "air" / "scripts" / script, scripts / script)
        (data / "airports.csv").write_text(
            "country;iata_code;name;latitude;longitude;alt_codes\n"
            "USA;AAA;Known Airport;1;2;KAAA\n", encoding="utf-8"
        )
        (data / "existing.alist").write_text("KAAA D\n", encoding="utf-8")
        (data / "new.alist").write_text("TAT A\nZZZ D\n", encoding="utf-8")
        (data / "recently_indexed.json").write_text("[]\n", encoding="utf-8")
        self.lookup = self.root / "lookup.csv"
        self.lookup.write_text(
            "iata_code,iso_country,name,latitude_deg,longitude_deg\n"
            "TAT,SK,Poprad-Tatry Airport,49.07,20.24\n"
            "BBB,US,Another Airport,3,4\n", encoding="utf-8"
        )
        run("git", "init", "-b", "master", cwd=self.seed)
        self.configure(self.seed)
        run("git", "add", ".", cwd=self.seed)
        run("git", "commit", "-m", "Initial data", cwd=self.seed)
        run("git", "clone", "--bare", str(self.seed), str(self.remote), cwd=self.root)
        run("git", "clone", str(self.remote), str(self.checkout), cwd=self.root)
        self.configure(self.checkout)
        self.env = os.environ.copy()
        self.env["TMPDIR"] = str(self.root)

    def configure(self, repo):
        run("git", "config", "user.name", "Test", cwd=repo)
        run("git", "config", "user.email", "test@example.com", cwd=repo)

    def process(self, check=True):
        return run(
            "bash", "air/scripts/process_airports.sh", str(self.lookup),
            cwd=self.checkout, env=self.env, check=check,
        )

    def read_published(self, path):
        return run("git", "--git-dir", str(self.remote), "show", f"master:{path}", cwd=self.root).stdout

    def test_new_and_existing_users_and_unresolved_codes(self):
        self.process()
        airports = list(csv.DictReader(
            self.read_published("air/data/airports.csv").splitlines(), delimiter=";"
        ))
        self.assertIn("TAT", [airport["iata_code"] for airport in airports])
        self.assertIn("TAT\n", self.read_published("air/data/airports-master.csv"))
        self.assertEqual(self.read_published("air/data/unknown_codes.txt"), "ZZZ\n")
        new_user = json.loads(self.read_published("air/data/new_airport_data.json"))
        existing = json.loads(self.read_published("air/data/existing_airport_data.json"))
        self.assertEqual(next(row for row in new_user if row["code"] == "TAT")["visits"], ["A"])
        self.assertEqual(next(row for row in existing if row["code"] == "AAA")["visits"], ["D"])
        self.assertEqual(json.loads(self.read_published("air/data/manifest.json")), ["existing", "new"])
        homepage = json.loads(self.read_published("air/data/homepage_data.json"))
        self.assertEqual(homepage["stats"]["airports_mapped"], 2)
        self.assertEqual(homepage["recently_added_airports"][0]["code"], "TAT")

    def test_rebuilds_after_a_concurrent_merge(self):
        other = self.root / "other"
        run("git", "clone", str(self.remote), str(other), cwd=self.root)
        self.configure(other)
        hook = self.checkout / ".git" / "hooks" / "pre-push"
        marker = self.root / "concurrent-update"
        hook.write_text(
            "#!/bin/bash\nset -e\nunset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE\n"
            f"if [ ! -e {shlex.quote(str(marker))} ]; then\n"
            f"  touch {shlex.quote(str(marker))}\n"
            f"  printf 'BBB A\\n' >> {shlex.quote(str(other / 'air/data/new.alist'))}\n"
            f"  git -C {shlex.quote(str(other))} add air/data/new.alist\n"
            f"  git -C {shlex.quote(str(other))} commit -m 'Concurrent update'\n"
            f"  git -C {shlex.quote(str(other))} push origin master\n"
            "fi\n", encoding="utf-8"
        )
        hook.chmod(0o755)
        result = self.process()
        self.assertIn("retrying with the latest data", result.stderr)
        user = json.loads(self.read_published("air/data/new_airport_data.json"))
        self.assertEqual(next(row for row in user if row["code"] == "BBB")["visits"], ["A"])
        self.assertIn("BBB\n", self.read_published("air/data/airports-master.csv"))

    def test_daily_run_retries_previously_unresolved_codes(self):
        self.process()
        with self.lookup.open("a", encoding="utf-8") as lookup:
            lookup.write("ZZZ,US,Later Airport,5,6\n")
        self.process()
        self.assertEqual(self.read_published("air/data/unknown_codes.txt"), "")
        user = json.loads(self.read_published("air/data/new_airport_data.json"))
        self.assertEqual(next(row for row in user if row["code"] == "ZZZ")["visits"], ["D"])
        self.assertIn("ZZZ\n", self.read_published("air/data/airports-master.csv"))

    def test_daily_run_without_changes_does_not_create_a_commit(self):
        self.process()
        before = run("git", "--git-dir", str(self.remote), "rev-parse", "master", cwd=self.root).stdout
        self.process()
        after = run("git", "--git-dir", str(self.remote), "rev-parse", "master", cwd=self.root).stdout
        self.assertEqual(before, after)

    def test_invalid_lookup_does_not_publish_partial_data(self):
        before = run("git", "--git-dir", str(self.remote), "rev-parse", "master", cwd=self.root).stdout
        self.lookup.write_text("invalid\n", encoding="utf-8")
        result = self.process(check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing required columns", result.stderr)
        self.assertEqual(
            run("git", "--git-dir", str(self.remote), "rev-parse", "master", cwd=self.root).stdout,
            before,
        )


if __name__ == "__main__":
    unittest.main()
