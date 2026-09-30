'use strict';
 describe('$$rAFScheduler', () => {

  beforeEach(angular.mock.module('ngAnimate'));

  test('should accept an array of tasks and run the first task immediately',
    angular.mock.inject(function($$rAFScheduler) {

    var taskSpy = jest.fn();
    var tasks = [taskSpy];
    $$rAFScheduler([tasks]);
    expect(taskSpy).toHaveBeenCalled();
  }));

  test('should run tasks based on how many RAFs have run in comparison to the task index',
    angular.mock.inject(function($$rAFScheduler, $$rAF) {
      var i;
      var tasks = [];

      for (i = 0; i < 5; i++) {
        tasks.push([jest.fn()]);
      }

      $$rAFScheduler(tasks);

      for (i = 1; i < 5; i++) {
        var taskSpy = tasks[i][0];
        expect(taskSpy).not.toHaveBeenCalled();
        $$rAF.flush();
        expect(taskSpy).toHaveBeenCalled();
      }
    }));

  test('should space out subarrays by a RAF and run the internals in parallel',
    angular.mock.inject(function($$rAFScheduler, $$rAF) {

    var spies = {
      a: jest.fn(),
      b: jest.fn(),
      c: jest.fn(),

      x: jest.fn(),
      y: jest.fn(),
      z: jest.fn()
    };

    var items = [[spies.a, spies.x],
                 [spies.b, spies.y],
                 [spies.c, spies.z]];

    expect(spies.a).not.toHaveBeenCalled();
    expect(spies.x).not.toHaveBeenCalled();

    $$rAFScheduler(items);

    expect(spies.a).toHaveBeenCalled();
    expect(spies.x).toHaveBeenCalled();


    expect(spies.b).not.toHaveBeenCalled();
    expect(spies.y).not.toHaveBeenCalled();

    $$rAF.flush();

    expect(spies.b).toHaveBeenCalled();
    expect(spies.y).toHaveBeenCalled();


    expect(spies.c).not.toHaveBeenCalled();
    expect(spies.z).not.toHaveBeenCalled();

    $$rAF.flush();

    expect(spies.c).toHaveBeenCalled();
    expect(spies.z).toHaveBeenCalled();
  }));

  describe('.waitUntilQuiet', () => {

    test('should run the `last` provided function when a RAF fully passes',
      angular.mock.inject(function($$rAFScheduler, $$rAF) {

      var q1 = jest.fn();
      $$rAFScheduler.waitUntilQuiet(q1);

      expect(q1).not.toHaveBeenCalled();

      var q2 = jest.fn();
      $$rAFScheduler.waitUntilQuiet(q2);

      expect(q1).not.toHaveBeenCalled();
      expect(q2).not.toHaveBeenCalled();

      var q3 = jest.fn();
      $$rAFScheduler.waitUntilQuiet(q3);

      expect(q1).not.toHaveBeenCalled();
      expect(q2).not.toHaveBeenCalled();
      expect(q3).not.toHaveBeenCalled();

      $$rAF.flush();

      expect(q1).not.toHaveBeenCalled();
      expect(q2).not.toHaveBeenCalled();
      expect(q3).toHaveBeenCalled();
    }));

    test('should always execute itself before the next RAF task tick occurs', () => {
      angular.mock.module(provideLog);
      angular.mock.inject(function($$rAFScheduler, $$rAF, log) {
        var quietFn = log.fn('quiet');
        var tasks = [
          [log.fn('task1')],
          [log.fn('task2')],
          [log.fn('task3')],
          [log.fn('task4')]
        ];

        $$rAFScheduler(tasks);
        expect(log).toEqual(['task1']);

        $$rAFScheduler.waitUntilQuiet(quietFn);
        expect(log).toEqual(['task1']);

        $$rAF.flush();

        expect(log).toEqual(['task1', 'quiet', 'task2']);

        $$rAF.flush();

        expect(log).toEqual(['task1', 'quiet', 'task2', 'task3']);

        $$rAFScheduler.waitUntilQuiet(quietFn);

        $$rAF.flush();

        expect(log).toEqual(['task1', 'quiet', 'task2', 'task3', 'quiet', 'task4']);
      });
    });
  });

});
