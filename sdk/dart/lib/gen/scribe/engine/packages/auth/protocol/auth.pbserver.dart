// This is a generated file - do not edit.
//
// Generated from scribe/engine/packages/auth/protocol/auth.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'auth.pb.dart' as $1;
import 'auth.pbjson.dart';

export 'auth.pb.dart';

abstract class AuthServiceBase extends $pb.GeneratedService {
  $async.Future<$1.AccountResult> getAccount(
      $pb.ServerContext ctx, $1.AccountRequest request);
  $async.Future<$1.BanResult> deleteAccount(
      $pb.ServerContext ctx, $1.AccountRequest request);
  $async.Future<$1.BanResult> ban($pb.ServerContext ctx, $1.BanRequest request);
  $async.Future<$1.BanResult> unban(
      $pb.ServerContext ctx, $1.AccountRequest request);
  $async.Future<$1.BanListResult> listBans(
      $pb.ServerContext ctx, $1.BanListRequest request);
  $async.Future<$1.DeviceListResult> listDevices(
      $pb.ServerContext ctx, $1.DeviceRequest request);
  $async.Future<$1.KickResult> kickDevice(
      $pb.ServerContext ctx, $1.DeviceRequest request);
  $async.Future<$1.KickResult> kickAllDevices(
      $pb.ServerContext ctx, $1.DeviceRequest request);
  $async.Future<$1.RoleListResult> listRoles(
      $pb.ServerContext ctx, $1.RoleListRequest request);
  $async.Future<$1.ValidateResult> validate(
      $pb.ServerContext ctx, $1.ValidateRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'GetAccount':
        return $1.AccountRequest();
      case 'DeleteAccount':
        return $1.AccountRequest();
      case 'Ban':
        return $1.BanRequest();
      case 'Unban':
        return $1.AccountRequest();
      case 'ListBans':
        return $1.BanListRequest();
      case 'ListDevices':
        return $1.DeviceRequest();
      case 'KickDevice':
        return $1.DeviceRequest();
      case 'KickAllDevices':
        return $1.DeviceRequest();
      case 'ListRoles':
        return $1.RoleListRequest();
      case 'Validate':
        return $1.ValidateRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'GetAccount':
        return getAccount(ctx, request as $1.AccountRequest);
      case 'DeleteAccount':
        return deleteAccount(ctx, request as $1.AccountRequest);
      case 'Ban':
        return ban(ctx, request as $1.BanRequest);
      case 'Unban':
        return unban(ctx, request as $1.AccountRequest);
      case 'ListBans':
        return listBans(ctx, request as $1.BanListRequest);
      case 'ListDevices':
        return listDevices(ctx, request as $1.DeviceRequest);
      case 'KickDevice':
        return kickDevice(ctx, request as $1.DeviceRequest);
      case 'KickAllDevices':
        return kickAllDevices(ctx, request as $1.DeviceRequest);
      case 'ListRoles':
        return listRoles(ctx, request as $1.RoleListRequest);
      case 'Validate':
        return validate(ctx, request as $1.ValidateRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => AuthServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => AuthServiceBase$messageJson;
}
