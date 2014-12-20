package net.pierrox.lightning_launcher.llscript.thirdpartyapitest;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.accounts.AccountManagerFuture;
import android.accounts.OperationCanceledException;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.gc.android.market.api.MarketSession;
import com.gc.android.market.api.model.Market;

import java.security.AccessControlException;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import static android.accounts.AccountManager.KEY_AUTHTOKEN;

/**
 * Created by Lukas on 29.11.2014.
 */
public class Parser extends Activity{

    String[] appsToQuery;
    String[] categories;
    Intent data;
    int i;
    int errorCode=0;
    String id;
    String token;
    ProgressBar bar;
    TextView text;
    static final String Tag="MyApp";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        appsToQuery = getIntent().getStringExtra("apps").split(",");
        Arrays.sort(appsToQuery);
        data = new Intent();
        data.putExtra("apps", appsToQuery);
        categories = new String[appsToQuery.length];
        id=getGsfAndroidId(getApplicationContext());
        i=0;
        if(id==null)
        {
            data.putExtra("error","No GSF-ID found");
            setResult(RESULT_CANCELED,data);
            finish();
        }
        else {
            setContentView(R.layout.main);
            bar= (ProgressBar)findViewById(R.id.progressBar);
            text = (TextView)findViewById(R.id.textView);
            bar.setMax(appsToQuery.length);
            bar.setProgress(1);
            text.setText("Initialize Query");
            Thread thread = new Thread(new Runnable() {
                @Override
                public void run() {
                    queryNext();
                }
            });
            thread.start();
        }
    }
    private void queryNext()
    {
        try {
        MarketSession session = new MarketSession();
        session.getContext().setAndroidId(id);
            if(i==0)
            {
                token = updateToken(true);
                if(token=="null")throw new AccessControlException("no token");
            }
        session.setAuthSubToken(token);

        MarketSession.Callback<Market.AppsResponse> callback = new MarketSession.Callback<Market.AppsResponse>() {
            @Override
            public void onResult(Market.ResponseContext context, Market.AppsResponse response) {
                Log.d(Tag, "Got response");
                if (response.getAppCount() > 0) {
                    int index = Arrays.asList(appsToQuery).indexOf(response.getApp(0).getPackageName());
                    Log.d(Tag, "Found: " + response.getApp(0).getPackageName() + " (" + response.getApp(0).getExtendedInfo().getCategory() + ")");
                    final Market.AppsResponse passResponse=response;
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            text.setText("Got response: " + passResponse.getApp(0).getPackageName() + " (" + passResponse.getApp(0).getExtendedInfo().getCategory() + ")");
                        }
                    });
                    if (index >= 0)categories[index] = response.getApp(0).getExtendedInfo().getCategory();
                }
            }
        };
        Log.d(Tag, "Query: " + appsToQuery[i]);
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    text.setText("Query: " + appsToQuery[i]);
                }
            });
        String query = "pname:" + appsToQuery[i];
        Market.AppsRequest appsRequest = Market.AppsRequest.newBuilder()
                .setQuery(query)
                .setStartIndex(0).setEntriesCount(1)
                .setWithExtendedInfo(true)
                .build();

        session.append(appsRequest, callback);
        session.flush();
    } catch (
            Exception e
            )

    {
        setResult(RESULT_CANCELED);
        e.printStackTrace();
        if(e.getClass()==AccessControlException.class)errorCode=2;
        else errorCode=1;
    } finally

    {
        if(errorCode==2)
        {
            data.putExtra("error","No Google account with access");
            setResult(RESULT_CANCELED,data);
            finish();
        }
        else {
            do {
                i++;
            } while (i < appsToQuery.length&&Arrays.asList(appsToQuery).subList(0, i).contains(appsToQuery[i]));
            if (i + 1 >= appsToQuery.length) {
                if (errorCode == 0){
                    data.putExtra("result", categories);
                    setResult(RESULT_OK, data);
                }
                else {
                    data.putExtra("error","Unknown Error in Query");
                    setResult(RESULT_CANCELED,data);
                }
                finish();
            } else {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        bar.setProgress(i + 1);
                    }
                });
                queryNext();
            }
        }
    }
    }

    private String updateToken(boolean invalidateToken) {
        String authToken = "null";
        try {
            AccountManager am = AccountManager.get(this);
            Account[] accounts = am.getAccountsByType("com.google");
            AccountManagerFuture<Bundle> accountManagerFuture;
            accountManagerFuture = am.getAuthToken(accounts[0], "android", null,this, null, null);
            Bundle authTokenBundle = accountManagerFuture.getResult(10, TimeUnit.SECONDS);
            authToken = authTokenBundle.getString(KEY_AUTHTOKEN);
            if(invalidateToken) {
                am.invalidateAuthToken("com.google", authToken);
                authToken = updateToken(false);
            }
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this,"Failed requesting AuthToken",Toast.LENGTH_LONG).show();
        }
        return authToken;
    }
    private String getGsfAndroidId(Context context) {
        String params[] = {"android_id"};
        Cursor c = context.getContentResolver().query(Uri.parse("content://com.google.android.gsf.gservices"), null, null, params, null);
        if (!c.moveToFirst() || c.getColumnCount() < 2)
            return null;
        try {
            return Long.toHexString(Long.parseLong(c.getString(1)));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
