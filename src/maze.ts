export interface MazeOptions {
  rows: number;
  cols: number;
  entrance: [number, number];
  exit: [number, number];
}

export default class Maze {
  private rows: number;
  private cols: number;
  private entrance: [number, number];
  private exit: [number, number];
  private matrix: number[][];

  constructor({ rows, cols, entrance, exit }: MazeOptions) {
    this.rows = rows;
    this.cols = cols;
    this.entrance = entrance;
    this.exit = exit;
    this.matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 1));

    this.generate();
  }

  public getMatrix(): number[][] {
    return this.matrix;
  }

  private generate(): void {
    const stack: [number, number][] = [this.entrance];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const [row, col] = current;
      this.matrix[row][col] = 0;

      const neighbors = this.getUnvisitedNeighbors(row, col);
      if (neighbors.length > 0) {
        stack.push(current);
        const [neighborRow, neighborCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.removeWall(current, [neighborRow, neighborCol]);
        stack.push([neighborRow, neighborCol]);
      }
    }

    const emptyRow = Array.from({length: this.rows}, () => 1)
    this.matrix = [emptyRow, ...this.matrix, emptyRow]
    this.rows += 2
  }

  private getUnvisitedNeighbors(row: number, col: number): [number, number][] {
    const neighbors: [number, number][] = [];

    if (row > 1 && this.matrix[row - 2][col] === 1) {
      neighbors.push([row - 2, col]);
    }
    if (col > 1 && this.matrix[row][col - 2] === 1) {
      neighbors.push([row, col - 2]);
    }
    if (row < this.rows - 2 && this.matrix[row + 2][col] === 1) {
      neighbors.push([row + 2, col]);
    }
    if (col < this.cols - 2 && this.matrix[row][col + 2] === 1) {
      neighbors.push([row, col + 2]);
    }

    return neighbors;
  }

  private removeWall(cell1: [number, number], cell2: [number, number]): void {
    const [row1, col1] = cell1;
    const [row2, col2] = cell2;

    const wallRow = (row1 + row2) / 2;
    const wallCol = (col1 + col2) / 2;

    this.matrix[wallRow][wallCol] = 0;
  }
}
