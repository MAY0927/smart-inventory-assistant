from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """Small single-process limiter for the demo service.

    Production deployments with multiple replicas should put an equivalent
    limit at the reverse proxy or back it with a shared store such as Redis.
    """

    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str, detail: str) -> None:
        now = monotonic()
        with self._lock:
            bucket = self._buckets[key]
            cutoff = now - self.window_seconds
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= self.limit:
                retry_after = max(1, int(self.window_seconds - (now - bucket[0])) + 1)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=detail,
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.append(now)

            if len(self._buckets) > 10_000:
                stale_keys = [
                    bucket_key
                    for bucket_key, values in self._buckets.items()
                    if not values or values[-1] <= cutoff
                ]
                for stale_key in stale_keys[:1_000]:
                    self._buckets.pop(stale_key, None)


def request_client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown-client"


login_limiter = InMemoryRateLimiter(limit=10, window_seconds=15 * 60)
image_user_limiter = InMemoryRateLimiter(limit=10, window_seconds=60 * 60)
image_ip_limiter = InMemoryRateLimiter(limit=30, window_seconds=60 * 60)
