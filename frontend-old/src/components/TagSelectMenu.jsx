import React from 'react';
import axios from 'axios';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
const bootstrap5DropdownMlHack = require('../bootstrap5-dropdown-ml-hack');

const TagSelectMenu = ({ innerRef, innerProps, isDisabled, children }) => {
  return !isDisabled ? (
      <div ref={innerRef} {...innerProps} className="customReactSelectMenu">
          {children}
          <div className="p-3">
            <button
                className="btn btn-info btn-sm btn-block"
                onClick={(e) => {
                  e.preventDefault();
                  if ($('.editFileModal').hasClass('show')) {
                    $('.editFileModal').on('hidden.bs.modal', function () {
                      console.log("hidden.bs.modal");
                      $('.addTagModal').modal('show');
                      $('.editFileModal').off('hidden.bs.modal');
                    });
                    $('.editFileModal').modal('hide');
                  }
                  else if ($('.editImageModal').hasClass('show')) {
                    $('.editImageModal').on('hidden.bs.modal', function () {
                      console.log("hidden.bs.modal");
                      $('.addTagModal').modal('show');
                      $('.editImageModal').off('hidden.bs.modal');
                    });
                    $('.editImageModal').modal('hide');
                    
                  }
                  else {
                    $('.addTagModal').modal('show');
                  }
                }}
            >
              Add New
            </button>
          </div>
      </div>
  ) : null;
}

export default TagSelectMenu;