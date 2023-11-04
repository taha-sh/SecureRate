from flask import (
    Blueprint, render_template, url_for, flash, send_file, abort, Response
)
import os
import shutil
from .layoutUtils import *
from .auth import *

bp = Blueprint('bl_download', __name__, url_prefix='/download')

@bp.route('/', methods=('GET', 'POST'))
@manage_cookie_policy
def download():
    mc = set_menu("download")
    error = 0
    return render_template('download/download.html', mc=mc, error=error)

@bp.route('/file', methods=['GET'])
@manage_cookie_policy
def download_file():
    try:
        # Define the directory you want to zip and serve
        base_path = "./extension"
        
        # The name of the ZIP file you want to serve
        zip_filename = "SecureRate.zip"
        
        # Full path where the ZIP file will be saved
        zip_fullpath = os.path.join(os.path.abspath(os.curdir), zip_filename)
        
        # Use os.path.abspath to ensure the directory is your specified directory
        abs_base_path = os.path.abspath(base_path)
        
        # Create a ZIP file of the ./application folder
        shutil.make_archive(zip_fullpath[:-4], 'zip', abs_base_path)
        
        return send_file(zip_fullpath, as_attachment=True, download_name=zip_filename)
    except Exception as e:
        return str(e)

