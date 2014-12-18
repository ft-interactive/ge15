'use strict';

module.exports = function(sequelize, DataTypes) {

  var Ward = sequelize.define('Ward', {
      id: { type: DataTypes.STRING(9), primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: DataTypes.STRING,
      constituencies: DataTypes.ARRAY(DataTypes.STRING(9))
  }, {

    freezeTableName: true,
    timestamps: true,
    underscored: true,

    associate: function(models) {
      // Ward.belongsTo(models.Constituency, {foreignKey: 'constituency_id'});
      Ward.belongsTo(models.Constituency, {foreignKey: 'region_id'});
    }
  });
 
  return Ward;
};
