export class PriorityQueue<T> {
  private heap: T[] = [];
  private readonly compare: (a: T, b: T) => number;

  /**
   * @param comparator  Return < 0 if `a` should be dequeued before `b`.
   */
  constructor(comparator: (a: T, b: T) => number) {
    this.compare = comparator;
  }

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /** Add an item and restore the heap invariant. */
  enqueue(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  /** Remove and return the highest-priority item (lowest comparator value). */
  dequeue(): T {
    if (this.isEmpty()) throw new Error('PriorityQueue is empty');
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (!this.isEmpty()) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  /** Peek without removing. */
  peek(): T | undefined {
    return this.heap[0];
  }

  /**
   * Drain the entire queue in priority order and return as an array.
   * The queue is empty after this call.
   */
  toSortedArray(): T[] {
    const result: T[] = [];
    while (!this.isEmpty()) result.push(this.dequeue());
    return result;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.heap[i], this.heap[parent]) < 0) {
        [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
        i = parent;
      } else {
        break;
      }
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.compare(this.heap[left], this.heap[smallest]) < 0) smallest = left;
      if (right < n && this.compare(this.heap[right], this.heap[smallest]) < 0) smallest = right;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

export interface PendingOrderRow {
  id: string;
  warehouse_id: string;
  status: string;
  created_at: string;   // ISO-8601 timestamptz
  is_urgent: boolean;
  total_weight_kg: number;
}

/**
 * Priority rules (lower score = higher priority):
 *   1. Older calendar day first  (YYYY-MM-DD string comparison)
 *   2. Within the same day: urgent (0) before normal (1)
 */
function orderPriorityScore(order: PendingOrderRow): [string, number] {
  const day = order.created_at.slice(0, 10); // 'YYYY-MM-DD'
  const urgencyScore = order.is_urgent ? 0 : 1;
  return [day, urgencyScore];
}

function orderComparator(a: PendingOrderRow, b: PendingOrderRow): number {
  const [dayA, urgA] = orderPriorityScore(a);
  const [dayB, urgB] = orderPriorityScore(b);

  // Older day = lower 'YYYY-MM-DD' string → comes first
  if (dayA < dayB) return -1;
  if (dayA > dayB) return 1;

  // Same day: urgent first
  return urgA - urgB;
}

/**
 * Takes an array of pending-order rows and returns them in priority order:
 *   older day → urgent first → normal.
 *
 * @example
 * const sorted = prioritizePendingOrders(orders);
 * console.log('[Priority Queue] result:', sorted);
 */
export function prioritizePendingOrders(orders: PendingOrderRow[]): PendingOrderRow[] {
  const pq = new PriorityQueue<PendingOrderRow>(orderComparator);
  for (const order of orders) pq.enqueue(order);
  return pq.toSortedArray();
}
