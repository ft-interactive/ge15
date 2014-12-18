'use strict';

module.exports = function(sequelize, DataTypes) {
  var Region = sequelize.define('Region', {
      id: { type: DataTypes.STRING(9), primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false }
  }, {

    freezeTableName: true,
    timestamps: true,
    underscored: true,

    associate: function(models) {
      Region.hasMany(models.Constituency, {foreignKey: 'region_id'});
      Region.hasMany(models.Election, {foreignKey: 'region_id'});
      Region.hasMany(models.Ward, {foreignKey: 'region_id'});
    }
  });

  return Region;
};
