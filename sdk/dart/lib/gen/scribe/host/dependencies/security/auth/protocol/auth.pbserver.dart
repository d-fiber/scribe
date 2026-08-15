// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/security/auth/protocol/auth.proto.

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
  $async.Future<$1.AccountResult> updateAccount(
      $pb.ServerContext ctx, $1.UpdateAccountRequest request);
  $async.Future<$1.DeleteAccountResult> deleteAccount(
      $pb.ServerContext ctx, $1.DeleteAccountRequest request);
  $async.Future<$1.SessionListResult> listSessions(
      $pb.ServerContext ctx, $1.SessionRequest request);
  $async.Future<$1.SignOutResult> signOut(
      $pb.ServerContext ctx, $1.SignOutRequest request);
  $async.Future<$1.ValidateResult> validate(
      $pb.ServerContext ctx, $1.ValidateRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'GetAccount':
        return $1.AccountRequest();
      case 'UpdateAccount':
        return $1.UpdateAccountRequest();
      case 'DeleteAccount':
        return $1.DeleteAccountRequest();
      case 'ListSessions':
        return $1.SessionRequest();
      case 'SignOut':
        return $1.SignOutRequest();
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
      case 'UpdateAccount':
        return updateAccount(ctx, request as $1.UpdateAccountRequest);
      case 'DeleteAccount':
        return deleteAccount(ctx, request as $1.DeleteAccountRequest);
      case 'ListSessions':
        return listSessions(ctx, request as $1.SessionRequest);
      case 'SignOut':
        return signOut(ctx, request as $1.SignOutRequest);
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
