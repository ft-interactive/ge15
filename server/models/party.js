'use strict';

module.exports = function(sequelize, DataTypes) {
  var Party = sequelize.define('Party', {
    abbrv: { type: DataTypes.STRING(50), primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    shortname: { type: DataTypes.STRING, allowNull: false },
    ftabbrv: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false },
    color: DataTypes.STRING,
    secondarycolor: DataTypes.STRING,
    win_count_before_ge: DataTypes.INTEGER,
    win_count: DataTypes.INTEGER,
    only_operates_in_region_id: DataTypes.STRING(9), 
    only_operates_in_region_name: DataTypes.STRING, 
    only_operates_in_region_slug: DataTypes.STRING, 
  }, {

    freezeTableName: true,
    timestamps: true,
    underscored: true,

    associate: function(models) {
      Party.hasMany(models.Candidate, {foreignKey: 'party_abbrv'});
    }
  });

  return Party;
}
