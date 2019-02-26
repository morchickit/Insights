from flask import Blueprint, jsonify

from ..data.job import get_job_status, get_queue_job, get_all_jobs, cancel_queue_job

bp = Blueprint('job', __name__)

@bp.route('/<jobid>')
def show_job_status(jobid):
    job = get_queue_job(jobid)

    # job not found
    if not job:
        return jsonify(
            error=404,
            status="not-found",
            jobid=jobid,
        ), 404

    status = get_job_status(job)
    return jsonify(status), status.get("error", 200)

@bp.route('/<jobid>/cancel')
def cancel_job(jobid):
    job = get_queue_job(jobid)

    # job not found
    if not job:
        return jsonify(
            error=404,
            status="not-found",
            jobid=jobid,
        ), 404

    cancel_queue_job(job)
    return jsonify(dict(
        status='cancelled-job',
        jobid=job.id,
        meta=job.meta,
    ))

@bp.route('/')
def show_all_jobs():
    return jsonify({
        "jobs": get_all_jobs()
    })
