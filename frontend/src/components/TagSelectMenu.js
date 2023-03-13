import React from 'react';
import axios from 'axios';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
const bootstrap5DropdownMlHack = require('../bootstrap5-dropdown-ml-hack');

const TagSelectMenu = ({ innerRef, innerProps, isDisabled, children }) =>
  !isDisabled ? (
      <div ref={innerRef} {...innerProps} className="customReactSelectMenu">
          {children}
          <div className="p-3">
            <button
                className="btn btn-info btn-sm btn-block"
                onClick={() => {
                    $('.addTagModal').modal('show');
                }}
            >
              Add New
            </button>
          </div>
      </div>
  ) : null;

export default TagSelectMenu;