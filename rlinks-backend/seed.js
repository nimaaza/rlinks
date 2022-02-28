const { Link, sequelize } = require('./src/db');
const config = require('./config');

const sampleUrls = [
  'https://sequelize.org/v6/manual/model-querying-basics.html#limits-and-pagination',
  'https://sequelize.org/',
  'https://www.dw.com/en/top-stories/s-9097',
  'https://join.com/companies/dot9/3960834-working-student-m-f-d-software-development',
  'https://keep.google.com/',
  'https://www.jetbrains.com/',
  'https://fullstackopen.com/en/part5/testing_react_apps',
  'https://github.com/nimaaza/rlinks',
  'https://press.princeton.edu/books/paperback/9780691160887/addiction-by-design',
  'https://testing-library.com/docs/react-testing-library/intro/',
  'https://martinfowler.com/articles/practical-test-pyramid.html',
  'https://kentcdodds.com/blog/how-to-add-testing-to-an-existing-project',
  'https://www.albertgao.xyz/2017/05/24/how-to-test-expressjs-with-jest-and-supertest/',
  'https://docs.cypress.io/guides/core-concepts/introduction-to-cypress#Cypress-Can-Be-Simple-Sometimes',
  'https://www.w3.org/International/questions/qa-personal-names.en',
  'https://support.microsoft.com/en-us/office/database-design-basics-eb2159cf-1e30-401a-8084-bd4f9c9ca1f5',
  'https://ezdxf.readthedocs.io/en/stable/usage_for_beginners.html#arch-usr',
  'https://doc.rust-lang.org/stable/book/',
  'https://talks.osfc.io/osfc2021/talk/JTWYEH/',
  'https://docs.docker.com/get-started/07_multi_container/',
  'https://iep.utm.edu/truth/',
  'https://www.youtube.com/watch?v=2Oe6HUgrRlQ',
  'https://react-bootstrap.github.io/forms/select/',
  'https://docs.cypress.io/guides/core-concepts/introduction-to-cypress#Cypress-Can-Be-Simple-Sometimes',
  'https://www.w3.org/International/questions/qa-personal-names.en',
  'https://support.microsoft.com/en-us/office/database-design-basics-eb2159cf-1e30-401a-8084-bd4f9c9ca1f5',
  'https://ezdxf.readthedocs.io/en/stable/usage_for_beginners.html#arch-usr',
  'https://doc.rust-lang.org/stable/book/',
  'https://talks.osfc.io/osfc2021/talk/JTWYEH/',
  'https://docs.docker.com/get-started/07_multi_container/',
  'https://www.dw.com/en/top-stories/s-9097',
  'https://join.com/companies/dot9/3960834-working-student-m-f-d-software-development',
  'https://keep.google.com/',
  'https://www.jetbrains.com/',
  'https://fullstackopen.com/en/part5/testing_react_apps',
  'https://github.com/nimaaza/rlinks',
];

const clear = async () => await Link.destroy({ truncate: true });

if (config.ENV === 'DEV') {
  clear();

  sampleUrls.forEach(async url => {
    try {
      await Link.transformer(url);
    } catch (error) {
      console.error(error.message);
    }
  });
}
