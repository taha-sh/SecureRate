import os
from werkzeug.serving import run_simple
from flask import Flask
from .jinjafilters import *
from .errorhandlers import *

def create_app():
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.environ['SESSION_SECRET'],
    )

    from . import bl_home
    app.register_blueprint(bl_home.bp)

    from . import bl_download
    app.register_blueprint(bl_download.bp)

    from . import bl_docs
    app.register_blueprint(bl_docs.bp)

    #Add other blueprints if needed

    from . import auth
    app.register_blueprint(auth.bp)

    #ADDS HANDLER FOR ERRORs
    app.register_error_handler(500, error_500)
    app.register_error_handler(404, error_404)

    #JINJA FILTERS
    app.jinja_env.filters['slugify'] = slugify
    app.jinja_env.filters['displayError'] = displayError 
    app.jinja_env.filters['displayMessage'] = displayMessage

    return app

def run_app(app):
    run_simple('127.0.0.1', 8080, app, ssl_context=('ssl/cert.pem', 'ssl/key.pem'))