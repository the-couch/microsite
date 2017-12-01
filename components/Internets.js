const h = require('bel')
const cx = require('classnames')
const cxs = require('cxs')

module.exports = function Header ({ internets }) {
  return h`
    <div class='${cxs({
      marginBottom: '2em'
    })}'>
      <h2 class='h6 caps cb track'><em>Internets</em></h2>
      <ul class='mt1 f fw'>
        ${internets.map((int, i) => h`
          <li class='${cx('rel', cxs({
            margin: '0 3em 1em 0'
          }))}'>
            <h3 class='rel'>
              <sup class='${cx('h6 abs left', cxs({
                color: 'var(--black)',
                top: '8px',
                transform: 'translateX(-200%)'
              }))}'>${i + 1}</sup>
              ${int.title}
            </h3>
            <p class='h6 mt0'>@ ${int.company}</p>

            <a href='${int.url}' target='_blank' class='abs fill z1'></a>
          </li>
        `)}
      </ul>
    </div>
  `
}
