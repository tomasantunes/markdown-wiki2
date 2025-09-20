// bootstrap5-dropdown-ml-hack.js
import { Dropdown } from 'bootstrap'

const CLASS_NAME = 'has-child-dropdown-show'

// Override toggle
Dropdown.prototype.toggle = (function (_original) {
    return function () {
        document.querySelectorAll('.' + CLASS_NAME).forEach(function (e) {
            e.classList.remove(CLASS_NAME)
        })
        let dd = this._element.closest('.dropdown').parentNode.closest('.dropdown')
        for (; dd && dd !== document; dd = dd.parentNode.closest('.dropdown')) {
            dd.classList.add(CLASS_NAME)
        }
        return _original.call(this)
    }
})(Dropdown.prototype.toggle)

// Hide event
document.querySelectorAll('.dropdown').forEach(function (dd) {
    dd.addEventListener('hide.bs.dropdown', function (e) {
        if (this.classList.contains(CLASS_NAME)) {
            this.classList.remove(CLASS_NAME)
            e.preventDefault()
        }
        e.stopPropagation()
    })
})

// Hover
document.querySelectorAll('.dropdown-hover, .dropdown-hover-all .dropdown').forEach(function (dd) {
    dd.addEventListener('mouseenter', function (e) {
        let toggle = e.target.querySelector(':scope>[data-bs-toggle="dropdown"]')
        if (!toggle.classList.contains('show')) {
            Dropdown.getOrCreateInstance(toggle).toggle()
            dd.classList.add(CLASS_NAME)
            Dropdown.clearMenus()
        }
    })
    dd.addEventListener('mouseleave', function (e) {
        let toggle = e.target.querySelector(':scope>[data-bs-toggle="dropdown"]')
        if (toggle.classList.contains('show')) {
            Dropdown.getOrCreateInstance(toggle).toggle()
        }
    })
})
