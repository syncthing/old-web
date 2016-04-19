var syncthingApp = angular.module('syncthingApp', []);

syncthingApp.controller('SyncthingCtrl', function ($scope) {
  $scope.donation = {
    amount: 20,
    failed: false,
    succeeded: false,
  };

  $scope.formatted = function () {
    return $scope.dollars().toFixed(2);
  };

  $scope.cents = function () {
    return $scope.dollars() * 100;
  };

  $scope.dollars = function () {
    return Math.floor($scope.donation.amount);
  }

  $scope.handler = StripeCheckout.configure({
    key: 'pk_live_7SJOzG0qoGnIjMHbEOnnhEce',
    image: '/img/logo-square.png',
    token: function (token) {
      $.post("https://syncthing.net/charge", "amount=" + $scope.dollars() + "&stripeToken=" + token.id + "&stripeEmail=" + token.email)
        .done(function () {
          $scope.handler.close();
          $scope.$apply(function () {
            $scope.donation.succeeded = true;
          });
        })
        .fail(function () {
          $scope.handler.close();
          $scope.$apply(function () {
            $scope.donation.failed = true;
          });
        });
    }
  });

  $scope.charge = function (dollars) {
    $scope.handler.open({
      name: 'Syncthing',
      description: 'Donation ($' + $scope.formatted() + ')',
      currency: "usd",
      amount: $scope.cents(),
      allowRememberMe: false,
      panelLabel: "Donate",
    });
  };

});
