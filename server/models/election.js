'use strict';

module.exports = function(sequelize, DataTypes) {
  var Election = sequelize.define('Election', {
      id: { type: DataTypes.BIGINT, primaryKey: true },
      poll_date: DataTypes.DATEONLY,
      is_byelection: {type: DataTypes.BOOLEAN, defaultValue: false},
      is_notional: {type: DataTypes.BOOLEAN, defaultValue: false},
      electorate: DataTypes.INTEGER,
      turnout: DataTypes.INTEGER,
      turnout_pc: DataTypes.DECIMAL,
      turnout_pc_change: DataTypes.DECIMAL,
      majority: DataTypes.INTEGER,
      majority_pc: DataTypes.DECIMAL,
      majority_pc_change: DataTypes.DECIMAL,
      sitting_party: DataTypes.STRING,
      is_gain: {type: DataTypes.BOOLEAN, defaultValue: false},
      swing: DataTypes.DECIMAL,
      swing_to: DataTypes.STRING,
      swing_from: DataTypes.STRING,
      winning_votes: DataTypes.INTEGER,
      winning_votes_pc: DataTypes.DECIMAL,
      winning_party_abbrv: DataTypes.STRING,
      winning_candidate_name: DataTypes.STRING,
      winning_candidate_id: DataTypes.INTEGER,

  }, {

    freezeTableName: true,
    timestamps: false,
    underscored: true,

    associate: function(models) {
      Election.belongsTo(models.Region, {foreignKey: 'region_id'});
      Election.belongsTo(models.Constituency, {foreignKey: 'constituency_id'});
      Election.hasMany(models.Candidate, {foreignKey: 'election_id'});
    }
  });

  return Election;
};
