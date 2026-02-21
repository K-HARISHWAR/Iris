import logging
import os
import sys
from datetime import datetime

def get_logger(name: str, log_dir: str = None) -> logging.Logger:
    """
    Returns a logger that writes to stdout AND a timestamped log file.

    Args:
        name:    Logger name (usually __name__ of calling module).
        log_dir: Directory to store log files. Defaults to <BASE>/logs/.
    """
    if log_dir is None:
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        log_dir = os.path.join(base, "logs")

    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger(name)
    if logger.handlers:          # avoid duplicate handlers on re-import
        return logger

    logger.setLevel(logging.DEBUG)

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    # File handler
    log_file = os.path.join(log_dir, f"{name}_{datetime.now():%Y%m%d_%H%M%S}.log")
    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    return logger
