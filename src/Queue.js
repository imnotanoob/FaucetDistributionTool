class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}
// First in First Out. 1->2->3 (Enqueue 4 = 1->2->3->4), dequeue = (2->3->4)
class Queue {
    constructor() {
        this.top = null;
        this.tail = null;
        this.length = 0;
    }
    enqueue(value) {
        var node = new Node(value);
        if (this.top === null || this.tail === null) {
            this.top = node;
            this.tail = node;
        } else {
            this.tail.next = node;
            this.tail = this.tail.next;
        }
        this.length++;
    }
    addFirst(value) {
        var node = new Node(value);
        if (this.top === null || this.tail === null) {
            this.top = node;
            this.tail = node;
        }else {
            var oldTop = this.top;
            this.top = node;
            this.top.next = oldTop;
        }
        this.length++;
    }
    dequeue() {
        if (this.top === null) {
            this.tail = null;
            this.length = 0;
            return null;
        }
        this.length--;
        var returnValue = this.top.value;
        this.top = this.top.next;
        return returnValue;
    }
    peek() {
        if (this.top === null) {
            return null;
        }
        return this.top.value;
    }
    isEmpty() {
        if (this.top === null) {
            return true;
        }
        return false;
    }
}
module.exports = Queue;