from celery import Celery
from app.pipeline import acquisition, transcription, extraction, synthesis, enhancement, output

celery_app = Celery("arcn", broker="redis://localhost:6379/0")


@celery_app.task
def run_acquisition(source_id: str):
    # lookup source, download, update status
    pass


@celery_app.task
def run_transcription(source_id: str):
    # lookup source, call transcription.transcribe_audio, store transcript
    pass


@celery_app.task
def run_extraction(source_id: str):
    pass


@celery_app.task
def run_synthesis(project_id: str):
    pass


@celery_app.task
def run_enhancement(project_id: str):
    pass
