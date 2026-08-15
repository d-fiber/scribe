// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/security/vpn/protocol/vpn.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'vpn.pb.dart' as $1;
import 'vpn.pbjson.dart';

export 'vpn.pb.dart';

abstract class VpnAdminServiceBase extends $pb.GeneratedService {
  $async.Future<$1.VpnResult> get($pb.ServerContext ctx, $1.VpnRef request);
  $async.Future<$1.VpnResult> getByOwner(
      $pb.ServerContext ctx, $1.OwnerRef request);
  $async.Future<$1.VpnResult> create(
      $pb.ServerContext ctx, $1.CreateRequest request);
  $async.Future<$1.VoidResult> delete($pb.ServerContext ctx, $1.VpnRef request);
  $async.Future<$1.VoidResult> deleteAll(
      $pb.ServerContext ctx, $1.OwnerRef request);
  $async.Future<$1.VoidResult> enable($pb.ServerContext ctx, $1.VpnRef request);
  $async.Future<$1.VoidResult> disable(
      $pb.ServerContext ctx, $1.VpnRef request);
  $async.Future<$1.VoidResult> disableAll(
      $pb.ServerContext ctx, $1.OwnerRef request);
  $async.Future<$1.VoidResult> rename(
      $pb.ServerContext ctx, $1.RenameRequest request);
  $async.Future<$1.PaginationResult> pagination(
      $pb.ServerContext ctx, $1.PaginationRequest request);
  $async.Future<$1.ConfigurationResult> configuration(
      $pb.ServerContext ctx, $1.VpnRef request);
  $async.Future<$1.QrcodeResult> qrcode(
      $pb.ServerContext ctx, $1.VpnRef request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Get':
        return $1.VpnRef();
      case 'GetByOwner':
        return $1.OwnerRef();
      case 'Create':
        return $1.CreateRequest();
      case 'Delete':
        return $1.VpnRef();
      case 'DeleteAll':
        return $1.OwnerRef();
      case 'Enable':
        return $1.VpnRef();
      case 'Disable':
        return $1.VpnRef();
      case 'DisableAll':
        return $1.OwnerRef();
      case 'Rename':
        return $1.RenameRequest();
      case 'Pagination':
        return $1.PaginationRequest();
      case 'Configuration':
        return $1.VpnRef();
      case 'Qrcode':
        return $1.VpnRef();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Get':
        return get(ctx, request as $1.VpnRef);
      case 'GetByOwner':
        return getByOwner(ctx, request as $1.OwnerRef);
      case 'Create':
        return create(ctx, request as $1.CreateRequest);
      case 'Delete':
        return delete(ctx, request as $1.VpnRef);
      case 'DeleteAll':
        return deleteAll(ctx, request as $1.OwnerRef);
      case 'Enable':
        return enable(ctx, request as $1.VpnRef);
      case 'Disable':
        return disable(ctx, request as $1.VpnRef);
      case 'DisableAll':
        return disableAll(ctx, request as $1.OwnerRef);
      case 'Rename':
        return rename(ctx, request as $1.RenameRequest);
      case 'Pagination':
        return pagination(ctx, request as $1.PaginationRequest);
      case 'Configuration':
        return configuration(ctx, request as $1.VpnRef);
      case 'Qrcode':
        return qrcode(ctx, request as $1.VpnRef);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => VpnAdminServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => VpnAdminServiceBase$messageJson;
}
