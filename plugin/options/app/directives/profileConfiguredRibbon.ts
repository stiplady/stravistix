interface IProfileConfiguredRibbonScope extends IScope {
    checkLocalSyncedAthleteProfileEqualsRemote: () => void;
    isProfileConfigured: boolean;
    showHistoryNonConsistent: boolean;
    hideHistoryNonConsistent: () => void;
    syncNow: (forceSync: boolean) => void;
    setProfileConfiguredAndHide: () => void;
    goToAthleteSettings: () => void;
}

class ProfileConfiguredRibbon {

    /**
     *
     * @param remoteAthleteProfile
     * @param localAthleteProfile
     * @return {boolean}
     */
    public static remoteAthleteProfileEqualsLocal(remoteAthleteProfile: IAthleteProfile, localAthleteProfile: IAthleteProfile) { // TODO move outside ?!
        let remoteEqualsLocal: boolean = true;
        if (remoteAthleteProfile.userGender !== localAthleteProfile.userGender ||
            remoteAthleteProfile.userMaxHr !== localAthleteProfile.userMaxHr ||
            remoteAthleteProfile.userRestHr !== localAthleteProfile.userRestHr ||
            remoteAthleteProfile.userFTP !== localAthleteProfile.userFTP ||
            remoteAthleteProfile.userWeight !== localAthleteProfile.userWeight) {
            remoteEqualsLocal = false; // Remote do not matches with local
        }
        return remoteEqualsLocal;
    }

    public static $inject: string[] = ['$scope', 'ChromeStorageService', '$location', '$window'];

    constructor(public $scope: IProfileConfiguredRibbonScope, public chromeStorageService: ChromeStorageService, public $location: ILocationService, public $window: IWindowService) {

        // chromeStorageService.removeFromLocalStorage('athleteProfile'); // TODO ...
        // chromeStorageService.removeFromLocalStorage('profileConfigured'); // TODO ...
        // chromeStorageService.removeFromLocalStorage('syncWithAthleteProfile'); // TODO ...
        // chromeStorageService.getAllFromLocalStorage().then((saved: any) => {  // TODO ...
        //     console.log(saved);
        // });

        // Considering that profile is configured at first. It's a nominal state before saying that is isn't
        $scope.isProfileConfigured = true;

        // Retrieve profile configured and display ribbon to inform user to configure it...
        chromeStorageService.getProfileConfigured().then((profileConfigured) => {
            $scope.isProfileConfigured = profileConfigured || !_.isEmpty(profileConfigured);
        });

        // Now check for athlete settings compliance between synced and local.
        // Inform user of re-sync if remote athlete settings have changed & a synchronisation exists
        // If yes show history non consistent message.
        $scope.checkLocalSyncedAthleteProfileEqualsRemote = () => {

            // If a synchronisation exists...
            chromeStorageService.getLastSyncDate().then((lastSyncDate: number) => {

                if (lastSyncDate !== -1) { // lastSyncDate exists
                    return chromeStorageService.fetchUserSettings(); // Get current default values from user settings (remote synced) and save them as a new profile
                } else { // No sync date
                    return null;
                }

            }).then((userSettings: IUserSettings) => {

                if (!userSettings || !userSettings.enableAlphaFitnessTrend) {
                    return null;
                }

                let remoteAthleteProfile: IAthleteProfile = {
                    userGender: userSettings.userGender,
                    userMaxHr: userSettings.userMaxHr,
                    userRestHr: userSettings.userRestHr,
                    userFTP: userSettings.userFTP,
                    userWeight: userSettings.userWeight,
                };

                chromeStorageService.getLocalSyncedAthleteProfile().then((localSyncedAthleteProfile: IAthleteProfile) => {
                    let remoteEqualsLocal: boolean = ProfileConfiguredRibbon.remoteAthleteProfileEqualsLocal(remoteAthleteProfile, localSyncedAthleteProfile);
                    $scope.showHistoryNonConsistent = !remoteEqualsLocal;
                });

            });
        };
        // ...Then execute...
        $scope.checkLocalSyncedAthleteProfileEqualsRemote();

        $scope.hideHistoryNonConsistent = () => {
            $scope.showHistoryNonConsistent = false;
        };

        $scope.goToAthleteSettings = () => {
            $location.path(routeMap.athleteSettingsRoute);
        };

        $scope.setProfileConfiguredAndHide = () => {

            chromeStorageService.getProfileConfigured().then((response: boolean) => {
                if (!response) {
                    chromeStorageService.setProfileConfigured(true).then(() => {
                        console.log('Profile configured');
                        $scope.isProfileConfigured = true;
                    });
                }
            });
        };

        $scope.syncNow = (forceSync: boolean) => {
            // localStorage.removeItem('localNotEqualsRemote');
            chrome.tabs.getCurrent((tab: Tab) => {
                $window.open('https://www.strava.com/dashboard?stravistixSync=true&forceSync=' + forceSync + '&sourceTabId=' + tab.id, '_blank', 'width=800, height=600, location=0');
            });
        };

        $scope.$on(AthleteSettingsController.changedAthleteProfileMessage, () => {
            $scope.checkLocalSyncedAthleteProfileEqualsRemote();
        });

    }
}

app.directive('profileConfiguredRibbon', [() => {

    return {
        controller: ProfileConfiguredRibbon,
        templateUrl: 'directives/templates/profileConfiguredRibbon.html'

    };
}]);