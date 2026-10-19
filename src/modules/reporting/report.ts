export function participationRate(completed: number, invited: number) { return invited === 0 ? 0 : Math.round(completed / invited * 1000) / 10; }

export function ensureReportAvailable(status: string, responses: number, minimum: number) {
  if (status !== "CLOSED") throw new Error("Báo cáo chỉ có sau khi khảo sát đóng.");
  if (responses < minimum) throw new Error(`Cần tối thiểu ${minimum} phản hồi để bảo vệ tính ẩn danh.`);
}

export function average(values: number[]) { return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100 : 0; }
