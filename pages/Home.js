const h = require('bel')
const api = require('../lib/api.js')
const connect = require('../lib/connect.js')
const Outer = require('../components/Outer.js')
const Header = require('../components/HomeHeader.js')
const Internets = require('../components/Internets.js')
const Projects = require('../components/Projects.js')
const Resume = require('../components/Resume.js')
const Footer = require('../components/Footer.js')

module.exports = connect(function Home([ homepage, internets, projects ]) {
  return Outer([
    Header(homepage.bio),
    Internets(internets),
    Projects(projects),
    Resume(),
    Footer()
  ])
}, function () {
  const homepage = api.getEntries({
    content_type: 'homepage'
  }).then(({ items }) => ({
    bio: items[0].fields.bio
  }))

  const projects = api.getEntries({
    content_type: 'project',
    order: '-fields.order'
  }).then(({ items }) => ({
    projects: items.map(item => item.fields)
  }))

  const internets = api.getEntries({
    content_type: 'internet',
    order: '-sys.createdAt'
  }).then(({ items }) => ({
    internets: items.map(item => item.fields)
  }))

  return Promise.all([
    homepage,
    internets,
    projects
  ])
})
