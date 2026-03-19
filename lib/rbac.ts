import connectDB from "@/lib/mongodb";
import Role from "@/models/Role";

export interface ModulePermission {
  moduleName: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export async function checkPermission(
  roleId: string,
  moduleName: string,
  action: "canView" | "canAdd" | "canEdit" | "canDelete"
): Promise<boolean> {
  await connectDB();
  const role = await Role.findOne({ _id: roleId }).lean<{ modules: ModulePermission[] }>();
  if (!role) return false;
  const perm = role.modules.find((p) => p.moduleName.toLowerCase() === moduleName.toLowerCase());
  if (!perm) return false;
  return Boolean(perm[action]);
}

export async function getRolePermissions(roleId: string): Promise<ModulePermission[]> {
  await connectDB();
  const role = await Role.findOne({ _id: roleId }).lean<{ modules: ModulePermission[] }>();
  return role?.modules ?? [];
}

export async function requirePermission(
  roleId: string,
  moduleName: string,
  action: "canView" | "canAdd" | "canEdit" | "canDelete"
): Promise<void> {
  const allowed = await checkPermission(roleId, moduleName, action);
  if (!allowed) {
    const err = new Error(`Forbidden: '${action}' not allowed on '${moduleName}'.`);
    (err as Error & { statusCode: number }).statusCode = 403;
    throw err;
  }
}
