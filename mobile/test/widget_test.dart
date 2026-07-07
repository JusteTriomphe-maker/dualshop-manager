import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dualshop_mobile/main.dart';

void main() {
  testWidgets('shows the login screen', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const DualShopApp());
    await tester.pump();

    expect(find.text('DualShop Manager'), findsWidgets);
    expect(find.text('Se connecter'), findsOneWidget);
  });
}
