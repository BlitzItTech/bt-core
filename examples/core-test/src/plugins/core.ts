import { createCore } from '../../../../core/dist/bt-core-app'

export default createCore({
    auth: {
        oauthClientID: 'appClient1'
    },
    navItems: [],
    getAuthUrl: () => '',
    presets: {},
    urls: {
        production: {
            auth: 'https://blitzitadminapis.azurewebsites.net/auth/v1',
            data: 'https://blitzitadminapis.azurewebsites.net/api/v1',
            localDbName: 'bt_web_admin_db',
            other: {

            }
        },
        staging: {
            auth: 'https://blitzitadminapisstaging.azurewebsites.net/auth/v1',
            data: 'https://blitzitadminapisstaging.azurewebsites.net/api/v1',
            localDbName: 'bt_web_admin_staging_db',
            other: {

            }
        },
        development: {
            auth: 'https://localhost:44363/auth/v1',
            data: 'https://localhost:44363/api/v1',
            localDbName: 'bt_web_admin_dev_db',
            other: {

            }
        }
    }
})