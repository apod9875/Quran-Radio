/**
 * InfiniteList: renders a long list one page at a time. The first page appears at once; a
 * "loading more" cursor at the end is watched by an IntersectionObserver and the next page is
 * appended before the user reaches it. One insertAdjacentHTML per page keeps scrolling smooth,
 * and click handlers delegated on the container keep working for the rows added later.
 */
(function (root) {
  class InfiniteList {
    constructor(container, { renderItem, pageSize = 30, emptyHtml = '', cursorText = '', observe } = {}) {
      this.container = container;
      this.renderItem = renderItem;
      this.pageSize = pageSize;
      this.emptyHtml = emptyHtml;
      this.cursorText = cursorText;
      this.items = [];
      this.rendered = 0;
      this.cursor = null;
      // Tests can pass their own observer factory; browsers use IntersectionObserver
      const makeObserver = observe || ((callback) => new root.IntersectionObserver(callback, { rootMargin: '600px 0px' }));
      this.observer = makeObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this.renderNextPage();
      });
    }

    // keepRendered: show at least as many rows as before (the list was re-ordered, not replaced)
    setItems(items, { emptyHtml, keepRendered } = {}) {
      const before = keepRendered ? this.rendered : 0;
      this.items = items;
      this.rendered = 0;
      this._dropCursor();
      if (emptyHtml !== undefined) this.emptyHtml = emptyHtml;
      if (!items.length) {
        this.container.innerHTML = this.emptyHtml;
        return;
      }
      this.container.innerHTML = '';
      this.renderNextPage();
      if (before > this.rendered) this._append(Math.min(this.items.length, before));
    }

    get done() {
      return this.rendered >= this.items.length;
    }

    renderNextPage() {
      if (this.done) return;
      const end = Math.min(this.items.length, this.rendered + this.pageSize);
      this._append(end);
    }

    // Make sure item `index` exists in the DOM (e.g. before scrolling to it)
    renderUpTo(index) {
      if (index >= this.rendered && !this.done) this._append(Math.min(this.items.length, index + 1 + this.pageSize));
    }

    _append(end) {
      this._dropCursor();
      let html = '';
      for (let i = this.rendered; i < end; i++) html += this.renderItem(this.items[i], i);
      this.container.insertAdjacentHTML('beforeend', html);
      this.rendered = end;
      if (!this.done) this._addCursor();
    }

    _addCursor() {
      const cursor = globalThis.document.createElement('div');
      cursor.className = 'list-cursor';
      cursor.setAttribute('role', 'status');
      cursor.innerHTML = `<span class="list-cursor-spinner" aria-hidden="true"></span><span>${this.cursorText}</span>`;
      this.container.appendChild(cursor);
      this.cursor = cursor;
      this.observer.observe(cursor);
    }

    _dropCursor() {
      if (!this.cursor) return;
      this.observer.unobserve(this.cursor);
      this.cursor.remove();
      this.cursor = null;
    }
  }

  root.InfiniteList = InfiniteList;
  if (typeof module !== 'undefined' && module.exports) module.exports = InfiniteList;
})(typeof self !== 'undefined' ? self : this);
