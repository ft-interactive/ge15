'use strict';

module.exports = function(sequelize, DataTypes) {
  var Candidate = sequelize.define('Candidate', {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      candidate_name: DataTypes.STRING,
      slug: DataTypes.STRING,
      date: DataTypes.DATEONLY,
      votes: DataTypes.INTEGER,
      votes_pc: DataTypes.DECIMAL,
      rush_text: DataTypes.STRING,
      sex: {
        type: DataTypes.ENUM,
        values: ['M', 'F'],
        allowNull: true
      }
  }, {

    freezeTableName: true,
    timestamps: true,
    underscored: true,

    associate: function(models) {
      Candidate.belongsTo(models.Election, {foreignKey: 'election_id'});
      Candidate.belongsTo(models.Constituency, {foreignKey: 'constituency_id'});
      Candidate.belongsTo(models.Party, {foreignKey: 'party_abbrv'});
    }
  });

  return Candidate;
};
