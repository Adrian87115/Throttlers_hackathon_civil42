import json
from urllib import request, parse

BASE_URL = "http://127.0.0.1:8000"


def call(path, query = None):
    url = f"{BASE_URL}{path}"
    if query:
        url += "?" + parse.urlencode(query, doseq = True)
    with request.urlopen(url, timeout = 10) as resp:
        data = resp.read().decode("utf-8")
        return resp.status, json.loads(data) if data else {}


def main():
    status, _ = call("/marketplace/skills")
    assert status == 200

    status, workers = call("/marketplace/workers/search", {"city": "Warsaw"})
    assert status == 200

    if workers:
        sample = workers[0]
        assert sample.get("exact_latitude") is None, "Anonymous should not see exact latitude"
        assert sample.get("exact_longitude") is None, "Anonymous should not see exact longitude"
        assert "email" not in sample, "Anonymous should not see personal email"
        assert "phone" not in sample, "Anonymous should not see phone"

        worker_user_id = sample["user_id"]
        status, contacts = call(f"/marketplace/workers/{worker_user_id}/contacts")
        assert status == 200
        assert len(contacts) == 0, "Anonymous should not see any contact channels"

    status, opportunities = call("/marketplace/opportunities", {"city": "Warsaw"})
    assert status == 200
    print(f"Anon smoke ok: workers={len(workers)}, opportunities={len(opportunities)}")


if __name__ == "__main__":
    main()
