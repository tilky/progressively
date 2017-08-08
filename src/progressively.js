/*!
* progressively 1.1.3
* https://github.com/thinker3197/progressively
* @license MIT licensed
*
* Copyright (C) 2016-17 Ashish
*/

;
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(function () {
      return factory(root)
    })
  } else if (typeof exports === 'object') {
    module.exports = factory
  } else {
    root.progressively = factory(root)
  }
})(this, function (root) {
  'use strict'

  var progressively = {}

  var defaults, poll, onLoad, inodes, sminodes

  onLoad = function () {}

  function extend (primaryObject, secondaryObject) {
    var o = {}
    for (var prop in primaryObject) {
      o[prop] = secondaryObject.hasOwnProperty(prop) ? secondaryObject[prop] : primaryObject[prop]
    }
    return o
  }

/**
 * Checks, if element is hidden
 * @param  object DOMElement
 * @return {Boolean}    [description]
 */
  function isHidden (el) {
    return (el.offsetParent === null)
  }

/**
 * Check if element is currently visible
 * @param  object DOMElement
 * @return boolean
 */
  function inView (el) {
    if (isHidden(el)) {
      return false
    }

    var box = el.getBoundingClientRect()
    var top = box.top
    var height = box.height

    el = el.parentNode

    do {
      box = el.getBoundingClientRect()

      if (!(top <= box.bottom)) {
        return false
      }
      if ((top + height) <= box.top) {
        return false
      }

      el = el.parentNode
    } while (el !== document.body && el !== document)

    return top <= document.documentElement.clientHeight
  }

/**
 * Load image and add loaded-class. Loads the minified version, if small display
 * @param  object DOMElement
 * @param  object defaults
 * @return boolean true, if fully loaded; false, if minified version was loaded
 */
  function loadImage (el, defaults) {
    setTimeout(function () {
      var img = new Image()

      img.onload = function () {
        el.classList.remove('progressive--not-loaded')
        el.classList.add('progressive--is-loaded')

        if (el.classList.contains('progressive__bg')) {
// Load image as css-background-image
          el.style['background-image'] = 'url("' + this.src + '")'
        } else {
          el.src = this.src
        }

        onLoad(el)
      }

// Load minified version, if viewport-width is smaller than defaults.smBreakpoint:
      if (getClientWidth() < defaults.smBreakpoint && el.getAttribute('data-progressive-sm')) {
        el.classList.add('progressive--loaded-sm')
        img.src = el.getAttribute('data-progressive-sm')
      }

      el.classList.remove('progressive--loaded-sm')
      img.src = el.getAttribute('data-progressive')
    }, defaults.delay)
  }

/**
 * Returns the width of the client's viewport
 * @return integer client-width
 */
  function getClientWidth () {
    return Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
  }

/**
 * Listens to an event, and throttles
 */
  function listen () {
    if (poll) {
      return
    }
    clearTimeout(poll)
    poll = setTimeout(function () {
      progressively.check()
      progressively.render()
      poll = null
    }, defaults.throttle)
  }

 /*
 * default settings
 */
  defaults = {
    throttle: 300, // appropriate value, don't change unless intended
    delay: 100,
    onLoadComplete: function () {},
    onLoad: function () {},
    smBreakpoint: 600
  }

/**
 * Initializer. Finds image-elements and adds listeners.
 * @param  object options
 */
  progressively.init = function (options) {
    options = options || {}

    defaults = extend(defaults, options)

    onLoad = defaults.onLoad || onLoad

    inodes = [].slice.call(document.querySelectorAll('.progressive__img, .progressive__bg'))
    sminodes = []

    progressively.render()

    if (document.addEventListener) {
      root.addEventListener('scroll', listen, false)
      root.addEventListener('resize', listen, false)
      root.addEventListener('load', listen, false)
    } else {
      root.attachEvent('onscroll', listen)
      root.attachEvent('onresize', listen)
      root.attachEvent('onload', listen)
    }
  }

/**
 * Loads necessary images in small or full quality.
 */
  progressively.render = function () {
    var elem

    for (var i = inodes.length - 1; i >= 0; --i) {
      elem = inodes[i]

      if (inView(elem) && (elem.classList.contains('progressive--not-loaded') || elem.classList.contains('progressive--loaded-sm'))) {
        loadImage(elem, defaults)
        if (elem.classList.contains('progressive--loaded-sm')) {
          sminodes.push(elem)
        }
        inodes.splice(i, 1)
      }
    }

    if (getClientWidth() >= defaults.smBreakpoint) {
      for (var j = sminodes.length - 1; j >= 0; --j) {
        elem = sminodes[j]

        if (inView(elem) && (elem.classList.contains('progressive--not-loaded') || elem.classList.contains('progressive--loaded-sm'))) {
          loadImage(elem, defaults)
          sminodes.splice(i, 1)
        }
      }
    }

    this.check()
  }

/**
 * Check if all images are loaded in full quality, then drop.
 */
  progressively.check = function () {
    if (!inodes.length && !sminodes.length) {
      defaults.onLoadComplete()
      this.drop()
    }
  }

/**
 * Drops progressively-listeners
 */
  progressively.drop = function () {
    if (document.removeEventListener) {
      root.removeEventListener('scroll', listen)
      root.removeEventListener('resize', listen)
    } else {
      root.detachEvent('onscroll', listen)
      root.detachEvent('onresize', listen)
    }
    clearTimeout(poll)
  }

  return progressively
})
