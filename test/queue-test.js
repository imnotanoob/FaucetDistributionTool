var Queue = require('../src/Queue');
var assert = require('assert');
describe('Queue', function() {
  describe('#single item queue', () => {
    var queue = new Queue();
    it('should remove and return the only item in the queue', function() {
      queue.enqueue(5);
      assert.equal(queue.dequeue(), 5);
    });
    it('should return and double check that the queue is empty, and there is nothing to dequeue', function() {
      assert.equal(queue.isEmpty(), true);
      assert.equal(queue.dequeue(), null);
    });
    it('should return, but not delete the first item', function() {
      queue.enqueue(6);
      assert.equal(queue.peek(), 6);
      assert.equal(queue.isEmpty(), false);
      queue.dequeue();
    });
    it('should add to the front of the queue', function() {
      queue.addFirst(3);
      assert.equal(3, queue.dequeue());
    });
  });
  describe('#multiple item queue', function() {
    var queue = new Queue();
    var length = 100;
    it('should remove and return the items in FIFO order', function() {
      queue = loadQueue(queue, length);
      assert.equal(length, queue.length);
      for (var i = 0; i < length; i++) {
        assert.equal(queue.dequeue(), i);
      }
    });
    it('should repeatedly return the first number', function() {
      queue = loadQueue(queue, length);
      for (var i = 0; i < length; i++) {
        assert.equal(queue.peek(), 0);
      }
    });
    it('should not be empty, until all elements have been deleted', function() {
      for (var i = 0; i < length; i++) {
        assert.equal(queue.isEmpty(), false);
        queue.dequeue();
      }
      assert.equal(queue.isEmpty(), true);
    });
    it('should add to the front of the queue, and return back in opposite order', function() {
      queue = loadQueue(queue, length, true);
      for (var i = length - 1; i >= 0; i--) {
        assert.equal(queue.dequeue(), i);
      }
    });
  });
});


function loadQueue(queue, n, front=false) {
  for (var i = 0; i < n; i++) {
    if(front) {
      queue.addFirst(i);
    } else {
      queue.enqueue(i);
    }
  }
  return queue;
}