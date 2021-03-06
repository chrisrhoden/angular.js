'use strict';

describe('ngClick (touch)', function() {
  var element, time, orig_now;

  // TODO(braden): Once we have other touch-friendly browsers on CI, allow them here.
  // Currently Firefox and IE refuse to fire touch events.
  var chrome = /chrome/.test(navigator.userAgent.toLowerCase());
  if (!chrome) {
    return;
  }

  function mockTime() {
    return time;
  }


  beforeEach(function() {
    module('ngTouch');
    orig_now = Date.now;
    time = 0;
    Date.now = mockTime;
  });

  afterEach(function() {
    dealoc(element);
    Date.now = orig_now;
  });


  it('should get called on a tap', inject(function($rootScope, $compile) {
    element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
    $rootScope.$digest();
    expect($rootScope.tapped).toBeUndefined();

    browserTrigger(element, 'touchstart');
    browserTrigger(element, 'touchend');
    expect($rootScope.tapped).toEqual(true);
  }));


  it('should pass event object', inject(function($rootScope, $compile) {
    element = $compile('<div ng-click="event = $event"></div>')($rootScope);
    $rootScope.$digest();

    browserTrigger(element, 'touchstart');
    browserTrigger(element, 'touchend');
    expect($rootScope.event).toBeDefined();
  }));


  it('should not click if the touch is held too long', inject(function($rootScope, $compile, $rootElement) {
    element = $compile('<div ng-click="count = count + 1"></div>')($rootScope);
    $rootElement.append(element);
    $rootScope.count = 0;
    $rootScope.$digest();

    expect($rootScope.count).toBe(0);

    time = 10;
    browserTrigger(element, 'touchstart',{
      keys: [],
      x: 10,
      y: 10
    });

    time = 900;
    browserTrigger(element, 'touchend',{
      keys: [],
      x: 10,
      y: 10
    });

    expect($rootScope.count).toBe(0);
  }));


  it('should not click if the touchend is too far away', inject(function($rootScope, $compile, $rootElement) {
    element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
    $rootElement.append(element);
    $rootScope.$digest();

    expect($rootScope.tapped).toBeUndefined();

    browserTrigger(element, 'touchstart',{
      keys: [],
      x: 10,
      y: 10
    });
    browserTrigger(element, 'touchend',{
      keys: [],
      x: 400,
      y: 400
    });

    expect($rootScope.tapped).toBeUndefined();
  }));


  it('should not click if a touchmove comes before touchend', inject(function($rootScope, $compile, $rootElement) {
    element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
    $rootElement.append(element);
    $rootScope.$digest();

    expect($rootScope.tapped).toBeUndefined();

    browserTrigger(element, 'touchstart',{
      keys: [],
      x: 10,
      y: 10
    });
    browserTrigger(element, 'touchmove');
    browserTrigger(element, 'touchend',{
      keys: [],
      x: 400,
      y: 400
    });

    expect($rootScope.tapped).toBeUndefined();
  }));

  it('should add the CSS class while the element is held down, and then remove it', inject(function($rootScope, $compile, $rootElement) {
    element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
    $rootElement.append(element);
    $rootScope.$digest();
    expect($rootScope.tapped).toBeUndefined();

    var CSS_CLASS = 'ng-click-active';

    expect(element.hasClass(CSS_CLASS)).toBe(false);
    browserTrigger(element, 'touchstart',{
      keys: [],
      x: 10,
      y: 10
    });
    expect(element.hasClass(CSS_CLASS)).toBe(true);
    browserTrigger(element, 'touchend',{
      keys: [],
      x: 10,
      y: 10
    });
    expect(element.hasClass(CSS_CLASS)).toBe(false);
    expect($rootScope.tapped).toBe(true);
  }));


  describe('the clickbuster', function() {
    var element1, element2;

    beforeEach(inject(function($rootElement, $document) {
      $document.find('body').append($rootElement);
    }));

    afterEach(inject(function($document) {
      $document.find('body').html('');
    }));


    it('should cancel the following click event', inject(function($rootScope, $compile, $rootElement, $document) {
      element = $compile('<div ng-click="count = count + 1"></div>')($rootScope);
      $rootElement.append(element);

      $rootScope.count = 0;
      $rootScope.$digest();

      expect($rootScope.count).toBe(0);

      // Fire touchstart at 10ms, touchend at 50ms, the click at 300ms.
      time = 10;
      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });

      time = 50;
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count).toBe(1);

      time = 100;
      browserTrigger(element, 'click',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count).toBe(1);
    }));


    it('should cancel the following click event even when the element has changed', inject(
        function($rootScope, $compile, $rootElement) {
      $rootElement.append(
          '<div ng-show="!tapped" ng-click="count1 = count1 + 1; tapped = true">x</div>' +
          '<div ng-show="tapped" ng-click="count2 = count2 + 1">y</div>'
      );
      $compile($rootElement)($rootScope);

      element1 = $rootElement.find('div').eq(0);
      element2 = $rootElement.find('div').eq(1);

      $rootScope.count1 = 0;
      $rootScope.count2 = 0;

      $rootScope.$digest();

      expect($rootScope.count1).toBe(0);
      expect($rootScope.count2).toBe(0);

      time = 10;
      browserTrigger(element1, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });

      time = 50;
      browserTrigger(element1, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count1).toBe(1);

      time = 100;
      browserTrigger(element2, 'click',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count1).toBe(1);
      expect($rootScope.count2).toBe(0);
    }));


    it('should not cancel clicks on distant elements', inject(function($rootScope, $compile, $rootElement) {
      $rootElement.append(
          '<div ng-click="count1 = count1 + 1">x</div>' +
          '<div ng-click="count2 = count2 + 1">y</div>'
      );
      $compile($rootElement)($rootScope);

      element1 = $rootElement.find('div').eq(0);
      element2 = $rootElement.find('div').eq(1);

      $rootScope.count1 = 0;
      $rootScope.count2 = 0;

      $rootScope.$digest();

      expect($rootScope.count1).toBe(0);
      expect($rootScope.count2).toBe(0);

      time = 10;
      browserTrigger(element1, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });

      time = 50;
      browserTrigger(element1, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count1).toBe(1);

      time = 90;
      // Verify that it is blured so we don't get soft-keyboard
      element1[0].blur = jasmine.createSpy('blur');
      browserTrigger(element1, 'click',{
        keys: [],
        x: 10,
        y: 10
      });
      expect(element1[0].blur).toHaveBeenCalled();

      expect($rootScope.count1).toBe(1);

      time = 100;
      browserTrigger(element1, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });

      time = 130;
      browserTrigger(element1, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count1).toBe(2);

      // Click on other element that should go through.
      time = 150;
      browserTrigger(element2, 'touchstart',{
        keys: [],
        x: 100,
        y: 120
      });
      browserTrigger(element2, 'touchend',{
        keys: [],
        x: 100,
        y: 120
      });
      browserTrigger(element2, 'click',{
        keys: [],
        x: 100,
        y: 120
      });

      expect($rootScope.count2).toBe(1);

      // Click event for the element that should be busted.
      time = 200;
      browserTrigger(element1, 'click',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count1).toBe(2);
      expect($rootScope.count2).toBe(1);
    }));


    it('should not cancel clicks that come long after', inject(function($rootScope, $compile) {
      element1 = $compile('<div ng-click="count = count + 1"></div>')($rootScope);

      $rootScope.count = 0;

      $rootScope.$digest();

      expect($rootScope.count).toBe(0);

      time = 10;
      browserTrigger(element1, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });

      time = 50;
      browserTrigger(element1, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });
      expect($rootScope.count).toBe(1);

      time = 2700;
      browserTrigger(element1, 'click',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count).toBe(2);
    }));


    it('should not cancel clicks that come long after', inject(function($rootScope, $compile) {
      element1 = $compile('<div ng-click="count = count + 1"></div>')($rootScope);

      $rootScope.count = 0;

      $rootScope.$digest();

      expect($rootScope.count).toBe(0);

      time = 10;
      browserTrigger(element1, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });

      time = 50;
      browserTrigger(element1, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count).toBe(1);

      time = 2700;
      browserTrigger(element1, 'click',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count).toBe(2);
    }));
  });


  describe('click fallback', function() {

    it('should treat a click as a tap on desktop', inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.tapped).toBeFalsy();

      browserTrigger(element, 'click');
      expect($rootScope.tapped).toEqual(true);
    }));


    it('should pass event object', inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="event = $event"></div>')($rootScope);
      $rootScope.$digest();

      browserTrigger(element, 'click');
      expect($rootScope.event).toBeDefined();
    }));
  });


  describe('disabled state', function() {
    it('should not trigger click if ngDisabled is true', inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="event = $event" ng-disabled="disabled"></div>')($rootScope);
      $rootScope.disabled = true;
      $rootScope.$digest();

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.event).toBeUndefined();
    }));
    it('should trigger click if ngDisabled is false', inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="event = $event" ng-disabled="disabled"></div>')($rootScope);
      $rootScope.disabled = false;
      $rootScope.$digest();

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.event).toBeDefined();
    }));
    it('should trigger click if ngEnabled is true', inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="event = $event" ng-enabled="enabled"></div>')($rootScope);
      $rootScope.enabled = true;
      $rootScope.$digest();

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.event).toBeDefined();
    }));
    it('should not trigger click if ngEnabled is false', inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="event = $event" ng-enabled="enabled"></div>')($rootScope);
      $rootScope.enabled = false;
      $rootScope.$digest();

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.event).toBeUndefined();
    }));
    it('should not trigger click if regular disabled is true', inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="event = $event" disabled="true"></div>')($rootScope);

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.event).toBeUndefined();
    }));
    it('should not trigger click if regular disabled is present', inject(function($rootScope, $compile) {
      element = $compile('<button ng-click="event = $event" disabled ></button>')($rootScope);

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.event).toBeUndefined();
    }));
    it('should trigger click if regular disabled is not present', inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="event = $event" ></div>')($rootScope);

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.event).toBeDefined();
    }));
  });


  describe('the normal click event', function() {
    it('should be capturable by other handlers', inject(function($rootScope, $compile) {
      var called = false;

      element = $compile('<div ng-click="event = $event" ></div>')($rootScope);

      element.on('click', function() {
        called = true;
      });

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect(called).toEqual(true);
    }));
  });
});
