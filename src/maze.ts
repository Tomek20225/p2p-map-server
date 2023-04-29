export interface MazeOptions {
  rows: number;
  cols: number;
}

interface Vector2 {
  x: number,
  y: number
}

export default class Maze {
  private rows: number;
  private cols: number;
  private entrance: Vector2;
  private exit: Vector2;
  private matrix: number[][];
  private walkablePositions: Vector2[];

  constructor({ rows, cols }: MazeOptions) {
    this.rows = rows;
    this.cols = cols;
    this.entrance = {x: 1, y: 1};
    this.matrix = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => 1));

    this.generate();

    this.walkablePositions = this.matrix.reduce((acc, currentValue, index) => {
		let walkablePositionsInRow: Vector2[] = [];
        for (let i = 0; i < currentValue.length; i++) {
			if (currentValue[i] == 0) walkablePositionsInRow.push({x: i, y: -index});
        }
        return [...acc, ...walkablePositionsInRow];
	}, [] as Vector2[]);
    this.exit = this.getRandomExit();
  }

  public getMatrix(): number[][] {
    return this.matrix;
  }

  private generate(): void {
    const stack: [number, number][] = [[this.entrance.x, this.entrance.y]];

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

  public getWalkablePositions(): Vector2[] {
    return this.walkablePositions;
  }

  public getRandomWalkablePosition(): Vector2 {
    return this.walkablePositions[Math.floor(Math.random() * this.walkablePositions.length)];
  }

  private getRandomExit(): Vector2 {
    return this.getRandomWalkablePosition();
  }

  public getExit(): Vector2 {
    return this.exit;
  }
}
