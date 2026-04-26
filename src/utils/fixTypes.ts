// Type assertions for req.params.id when using with TypeORM
export function getParamId(id: string | string[]): string {
  return String(id);
}
