import mongoose, { Schema, Document, Model } from 'mongoose';
import connectDB from '@/lib/mongodb';

export type ModuleName =
  | 'dashboard'
  | 'users'
  | 'universities'
  | 'students'
  | 'companies'
  | 'ojt_wall'
  | 'connections'
  | 'email_logs'
  | 'settings';

export type RoleName = 'super_admin' | 'university_admin' | 'student' | 'company';

export interface IModulePermission {
  moduleName: ModuleName;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface IRole extends Document<string> {
  _id: string;
  roleName: RoleName;
  description?: string;
  modules: IModulePermission[];
  createdAt: Date;
  updatedAt: Date;
}

const ModulePermissionSchema = new Schema<IModulePermission>(
  {
    moduleName: {
      type: String,
      required: true,
      enum: [
        'dashboard',
        'users',
        'universities',
        'students',
        'companies',
        'ojt_wall',
        'connections',
        'email_logs',
        'settings',
      ] as ModuleName[],
    },
    canView: { type: Boolean, default: false },
    canAdd: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoleSchema = new Schema<IRole>(
  {
    _id: { type: String, required: true },
    roleName: {
      type: String,
      required: true,
      unique: true,
      enum: ['super_admin', 'university_admin', 'student', 'company'] as RoleName[],
    },
    description: { type: String },
    modules: { type: [ModulePermissionSchema], default: [] },
  },
  {
    timestamps: true,
    _id: false,
  }
);

void connectDB;

const Role: Model<IRole> =
  (mongoose.models.Role as Model<IRole>) ||
  mongoose.model<IRole>('Role', RoleSchema);

export default Role;
