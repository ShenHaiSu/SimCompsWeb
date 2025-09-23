export interface Schema {
  /** 对sqlite是否支持（因为后续可能扩展pgsql作为上位替代） */
  sqliteSupport: boolean;
  /** 文件名需要以.db结尾 */
  fileName: string;
  /** 表名 */
  tableName: string;
  /** 字段列表 */
  fields: Field[];
  /** 其他属性，追加在创建数据表后面的 */
  other: string;
  /** 创建索引字段的sql语句 */
  index: string[];
  /** 创建外键的sql语句 */
  foreignKey: string[];
}

export interface Field {
  /** 字段名 */
  name: string;
  /** 字段类型，例如：TEXT、INTEGER、REAL、NUMERIC、BLOB */
  type: string;
  /** 其他属性，例如：主键、唯一、索引等 */
  other: string;
  /** 字段的中文名称 */
  label?: string;
  /** 字段的中文描述 */
  describe?: string;
}
