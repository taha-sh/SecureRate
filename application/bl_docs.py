from flask import (
    Blueprint, render_template, url_for
)
from .layoutUtils import *
from .auth import *

bp = Blueprint('bl_docs', __name__, url_prefix='/docs')

@bp.route('/',methods=('GET', 'POST'))
@manage_cookie_policy
def docs():
    mc = set_menu("Docs")
    page_title = "Here is where all the documentation will be"
    page_title_for_id = "Here is where all the documentation will be"
    return render_template('docs/docs.html', mc=mc, 
        page_title=page_title, page_title_for_id=page_title_for_id)

@bp.route('/<slug>',methods=('GET', 'POST'))
@manage_cookie_policy
def tutorial(slug=''):
    mc = set_menu("Docs") 
    page_title = "This is a title that will end up in the page url"
    return render_template('docs/tutorial.html', mc=mc, page_title=page_title) 

@bp.route('/<slug>/<int:id>',methods=('GET', 'POST'))
@manage_cookie_policy
def faq(slug='', id=0):
    mc = set_menu("Docs")  
    page_title_for_id = "This is a title that will end up in the page url"
    return render_template('docs/faq.html', mc=mc, page_title_for_id=page_title_for_id)  
