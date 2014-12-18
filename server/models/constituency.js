'use strict';

module.exports = function(sequelize, DataTypes) {
  var Constituency = sequelize.define('Constituency', {
    id: { type: DataTypes.STRING(9), primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false },
    bbc_id: DataTypes.INTEGER,
    pa_id: DataTypes.INTEGER,
    guardian_id: DataTypes.INTEGER,
    ons_name: DataTypes.STRING,
    region_name: { type: DataTypes.STRING, allowNull: true },
    region_slug: { type: DataTypes.STRING, allowNull: true }
  }, {

    freezeTableName: true,
    timestamps: true,
    underscored: true,

    associate: function(models) {
      Constituency.belongsTo(models.Region, {foreignKey: 'region_id'});
      // Constituency.hasMany(models.Ward, {foreignKey: 'constituency_id'});
      Constituency.hasMany(models.Election, {foreignKey: 'constituency_id'});
      Constituency.hasMany(models.Candidate, {foreignKey: 'constituency_id'});
      Constituency.hasMany(models.ConstituencyGroup, {
        foreignKey: 'constituency_id', through: 'ConstituencyGroupMember'
      });
      // TODO: is there a way to have something like model.lastElection and model.thisElection
    }
  });

  return Constituency;
};
