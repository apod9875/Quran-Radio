// InfiniteList with a fake container and a fake IntersectionObserver.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);

class FakeNode {
  constructor() { this.className = ''; this.innerHTML = ''; this.parent = null; }
  setAttribute() {}
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = null;
  }
}

class FakeContainer {
  constructor() { this.children = []; this.html = ''; }
  set innerHTML(value) { this.html = value; this.children = []; }
  get innerHTML() { return this.html; }
  insertAdjacentHTML(position, html) { this.children.push({ html }); }
  appendChild(node) { node.parent = this; this.children.push(node); }
  get rows() { return this.children.filter((c) => c.html !== undefined).map((c) => c.html).join('').split('|').filter(Boolean); }
  get cursor() { return this.children.find((c) => c.className === 'list-cursor'); }
}

globalThis.document = { createElement: () => new FakeNode() };
const InfiniteList = require('../../../web/js/core/infinite-list.js');

function makeList(pageSize = 10) {
  const observer = { target: null, callback: null };
  const container = new FakeContainer();
  const list = new InfiniteList(container, {
    pageSize,
    renderItem: (item) => `${item}|`,
    emptyHtml: 'EMPTY',
    observe: (callback) => {
      observer.callback = callback;
      return { observe: (node) => { observer.target = node; }, unobserve: () => { observer.target = null; } };
    }
  });
  const scrollToCursor = () => observer.callback([{ isIntersecting: true }]);
  return { list, container, observer, scrollToCursor };
}

const range = (n) => Array.from({ length: n }, (_, i) => i);

describe('InfiniteList', () => {
  it('renders only the first page and watches a cursor at its end', () => {
    const { list, container, observer } = makeList();
    list.setItems(range(25));
    assert.equal(container.rows.length, 10);
    assert.ok(container.cursor, 'a loading cursor follows the first page');
    assert.equal(observer.target, container.cursor);
  });

  it('appends the next page when the cursor comes into view, and drops it at the end', () => {
    const { list, container, scrollToCursor } = makeList();
    list.setItems(range(25));
    scrollToCursor();
    assert.equal(container.rows.length, 20);
    scrollToCursor();
    assert.equal(container.rows.length, 25);
    assert.equal(container.cursor, undefined, 'no cursor once everything is shown');
    assert.ok(list.done);
  });

  it('ignores observer callbacks that are not intersecting', () => {
    const { list, container, observer } = makeList();
    list.setItems(range(25));
    observer.callback([{ isIntersecting: false }]);
    assert.equal(container.rows.length, 10);
  });

  it('renders up to a given item on demand (letter jumps)', () => {
    const { list, container } = makeList();
    list.setItems(range(100));
    list.renderUpTo(42);
    assert.ok(container.rows.length >= 43);
    assert.ok(container.rows.includes('42'));
  });

  it('starts again from the first page when the items change', () => {
    const { list, container, scrollToCursor } = makeList();
    list.setItems(range(25));
    scrollToCursor();
    list.setItems(range(15).map((n) => n + 100));
    assert.deepEqual(container.rows.slice(0, 2), ['100', '101']);
    assert.equal(container.rows.length, 10);
  });

  it('shows the empty message for an empty list and no cursor for a short one', () => {
    const { list, container } = makeList();
    list.setItems([]);
    assert.equal(container.innerHTML, 'EMPTY');
    list.setItems(range(3));
    assert.equal(container.rows.length, 3);
    assert.equal(container.cursor, undefined);
  });
});
