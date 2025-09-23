import type { Schema } from "#composable/app/Schemas.ts";

export const userSchema: Schema = {
  sqliteSupport: true,
  fileName: "main.db",
  tableName: "user",
  fields: [
    { name: "id", type: "INTEGER", other: "PRIMARY KEY AUTOINCREMENT" },
    { name: "name", type: "TEXT", other: "", label: "用户名", describe: "用户登录名" },
    { name: "password", type: "TEXT", other: "", label: "密码", describe: "用户登录密码,需要经过doubleMD5" },
    { name: "register_ip", type: "TEXT", other: "", label: "注册IP", describe: "用户注册时的IP地址" },
    { name: "register_time", type: "TEXT", other: "not null", label: "注册时间", describe: "用户注册时间" },
    { name: "lock", type: "INTEGER", other: "default 1", label: "锁定状态", describe: "用户是否被锁定" },
    {
      name: "permission_rule",
      type: "TEXT",
      other: "not null default user",
      label: "权限角色",
      describe: "用户的权限角色,允许值:user/admin/guest",
    },
    {
      name: "permission_node",
      type: "TEXT",
      other: "not null default '[]'",
      label: "权限节点",
      describe: "用户的实际权限节点,格式为JSON字符串,例如:[{key:'link.read',value:true}]",
    },
  ],
  other: "",
  index: [`create index if not exists idx_user_name on user (name)`],
  foreignKey: [],
};
