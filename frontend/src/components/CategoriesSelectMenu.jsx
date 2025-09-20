import React from 'react';

const CategoriesSelectMenu = ({ innerRef, innerProps, isDisabled, children }) =>
  !isDisabled ? (
      <div ref={innerRef} {...innerProps} className="customReactSelectMenu">
          {children}
          <div className="p-3">
            <button
                className="btn btn-info btn-sm btn-block"
                onClick={(e) => {
                  e.preventDefault();
                  if (document.querySelector('.editFileModal')?.classList.contains('show')) {
                    document.querySelectorAll('.editFileModal').forEach(el => {
                      el.addEventListener('hidden.bs.modal', function () {
                        var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addCategoryModal'))
                        modal.show();
                        el.removeEventListener('hidden.bs.modal', this);
                      });
                    });
                    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.editFileModal'))
                    modal.hide();
                  }
                  else if (document.querySelector('.editImageModal')?.classList.contains('show')) {
                    document.querySelectorAll('.editImageModal').forEach(el => {
                      el.addEventListener('hidden.bs.modal', function () {
                        var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addCategoryModal'))
                        modal.show();
                        el.removeEventListener('hidden.bs.modal', this);
                      });
                    });
                    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.editImageModal'))
                    modal.hide();
                  }
                  else {
                    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addCategoryModal'))
                    modal.show();
                  }
                }}
            >
              Add New
            </button>
          </div>
      </div>
  ) : null;

export default CategoriesSelectMenu;