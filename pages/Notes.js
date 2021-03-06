const api = require('../lib/api.js')
const connect = require('../lib/connect.js')
const Outer = require('../components/Outer.js')
const Header = require('../components/Header.js')
const Notes = require('../components/Notes.js')
const Footer = require('../components/Footer.js')

module.exports = connect(function Home(notes) {
  return Outer([
    Header('Notes'),
    Notes(notes),
    Footer()
  ])
}, function () {
  const notes = api.getEntries({
    content_type: 'note'
  }).then(({ items }) => ({
    notes: items.map(i => i.fields)
  }))

  return notes
})
