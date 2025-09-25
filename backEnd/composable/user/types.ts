export class User {
  id: number;
  name: string;
  password?: string; // Password might not always be returned from DB for security reasons
  register_ip: string;
  register_time: string;
  lock: boolean;
  permission_rule: string;
  permission_node: string;
  permission_list: PermissionNode[];

  constructor(data: {
    id: number;
    name: string;
    password?: string;
    register_ip: string;
    register_time: string;
    lock: number;
    permission_rule: string;
    permission_node: string;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.password = data.password;
    this.register_ip = data.register_ip;
    this.register_time = data.register_time;
    this.lock = data.lock === 1;
    this.permission_rule = data.permission_rule;
    this.permission_node = data.permission_node;

    try {
      this.permission_list = JSON.parse(data.permission_node);
    } catch (e) {
      this.permission_list = [];
    }
  }

  // You can add methods here if needed
}

/**
 * 权限节点对象
 */
export interface PermissionNode {
  key: string;
  value: boolean;
  describe?: string;
}
