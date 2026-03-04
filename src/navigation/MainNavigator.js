import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import MyRoomScreen from '../screens/Profile/MyRoomScreen';
import UpdateProfileScreen from '../screens/Profile/UpdateProfileScreen';
import MyContractScreen from '../screens/Contract/MyContractScreen';

// Request Screens
import RequestListScreen from '../screens/Request/RequestListScreen';
import CreateRepairRequestScreen from '../screens/Request/CreateRepairRequestScreen';
import CreateComplaintRequestScreen from '../screens/Request/CreateComplaintRequestScreen';
import CreateMovingRoomRequestScreen from '../screens/Request/CreateMovingRoomRequestScreen';
import RequestDetailScreen from '../screens/Request/RequestDetailScreen';
import UpdateRequestScreen from '../screens/Request/UpdateRequestScreen';
import UpdateRepairRequestScreen from '../screens/Request/UpdateRepairRequestScreen';
import UpdateTransferRequestScreen from '../screens/Request/UpdateTransferRequestScreen';

// Additional Screens
import NotificationListScreen from '../screens/Notification/NotificationListScreen';
import InvoiceListScreen from '../screens/Invoice/InvoiceListScreen';
import ServiceListScreen from '../screens/Service/ServiceListScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="HomeStack"
        component={HomeScreen}
        options={{
          title: 'Trang chủ',
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Thông tin cá nhân',
        }}
      />
      <Stack.Screen
        name="UpdateProfile"
        component={UpdateProfileScreen}
        options={{
          title: 'Cập nhật thông tin',
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: 'Đổi mật khẩu',
        }}
      />
      <Stack.Screen
        name="MyRoom"
        component={MyRoomScreen}
        options={{
          title: 'Phòng của tôi',
        }}
      />
      <Stack.Screen
        name="ContractList"
        component={MyContractScreen}
        options={{
          title: 'Hợp đồng của tôi',
        }}
      />
      <Stack.Screen
        name="RequestList"
        component={RequestListScreen}
        options={{
          title: 'Yêu cầu',
        }}
      />
      <Stack.Screen
        name="CreateMaintenanceRequest"
        component={CreateRepairRequestScreen}
        options={{
          title: 'Yêu cầu sửa chữa/Bảo trì',
        }}
      />
      <Stack.Screen
        name="CreateComplaintRequest"
        component={CreateComplaintRequestScreen}
        options={{
          title: 'Yêu cầu khiếu nại',
        }}
      />
      <Stack.Screen
        name="CreateMovingRoomRequest"
        component={CreateMovingRoomRequestScreen}
        options={{
          title: 'Yêu cầu chuyển phòng',
        }}
      />
      <Stack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
        options={{
          title: 'Chi tiết yêu cầu',
        }}
      />
      <Stack.Screen
        name="UpdateRequest"
        component={UpdateRequestScreen}
        options={{
          title: 'Cập nhật yêu cầu',
        }}
      />
      <Stack.Screen
        name="UpdateRepairRequest"
        component={UpdateRepairRequestScreen}
        options={{
          title: 'C\u1eadp nh\u1eadt y\u00eau c\u1ea7u s\u1eeda ch\u1eefa',
        }}
      />
      <Stack.Screen
        name="UpdateTransferRequest"
        component={UpdateTransferRequestScreen}
        options={{
          title: 'C\u1eadp nh\u1eadt y\u00eau c\u1ea7u chuy\u1ec3n ph\u00f2ng',
        }}
      />
      <Stack.Screen
        name="NotificationList"
        component={NotificationListScreen}
        options={{
          title: 'Thông báo',
        }}
      />
      <Stack.Screen
        name="InvoiceList"
        component={InvoiceListScreen}
        options={{
          title: 'Hóa đơn',
        }}
      />
      <Stack.Screen
        name="ServiceList"
        component={ServiceListScreen}
        options={{
          title: 'Dịch vụ',
        }}
      />
    </Stack.Navigator>
  );
}


export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } 

          return (
            <MaterialCommunityIcons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Trang chủ',
        }}
      />
    
    </Tab.Navigator>
  );
}
