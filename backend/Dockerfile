# --- build stage: install wheels into an isolated virtualenv -------------------------
FROM python:3.13-slim AS build
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /venv
COPY requirements.txt /tmp/requirements.txt
RUN /venv/bin/pip install -r /tmp/requirements.txt

# --- runtime stage ---------------------------------------------------------------------
FROM python:3.13-slim
ENV PATH=/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    DATA_DIR=/data
RUN useradd --create-home --uid 1000 neurodrift && mkdir -p /data && chown neurodrift /data
COPY --from=build /venv /venv
WORKDIR /app
COPY --chown=neurodrift alembic.ini pyproject.toml ./
COPY --chown=neurodrift alembic ./alembic
COPY --chown=neurodrift app ./app
COPY --chown=neurodrift docker-entrypoint.sh ./
USER neurodrift
EXPOSE 8000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["api"]
