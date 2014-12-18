'use strict';

module.exports = function(sequelize, DataTypes) {
  var ConstituencyGroup = sequelize.define('ConstituencyGroup', {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: DataTypes.STRING,
      weight: { type: DataTypes.INTEGER, defaultValue: 0}
  }, {

    freezeTableName: true,
    tableName: 'ConstituencyGroup',
    timestamps: true,
    underscored: true,

    associate: function(models) {
      ConstituencyGroup.hasMany(models.Constituency, {
        foreignKey: 'group_id',
        through: 'ConstituencyGroupMember'
      });
    }
  });

  return ConstituencyGroup;
};
