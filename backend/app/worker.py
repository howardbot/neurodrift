"""RQ worker entry point: ``python -m app.worker``.

One worker process handles one job at a time (each job runs in a forked child), which
keeps memory bounded on small hosts. Logging is configured before forking so job logs
use the same structured format as the API.
"""

from redis import Redis
from rq import Queue, Worker

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.services.experiments import QUEUE_NAME


def main() -> None:
    settings = get_settings()
    configure_logging(settings.log_level)
    connection = Redis.from_url(settings.redis_url)
    Worker([Queue(QUEUE_NAME, connection=connection)], connection=connection).work()


if __name__ == "__main__":
    main()
